import {SampleCustomClaims} from '../../logic/entities/sampleCustomClaims.js';
import {BaseClaims} from '../../plumbing/claims/baseClaims.js';
import {CustomClaims} from '../../plumbing/claims/customClaims.js';
import {CustomClaimsProvider} from '../../plumbing/claims/customClaimsProvider.js';
import {UserInfoClaims} from '../../plumbing/claims/userInfoClaims.js';

/*
 * This class provides any API specific custom claims
 */
export class SampleCustomClaimsProvider extends CustomClaimsProvider {

    /*
     * Determine the user in business terms from the Authorization Server's subject claim
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async get(accessToken: string, token: BaseClaims, userInfo: UserInfoClaims): Promise<CustomClaims> {

        // A real system would do a database lookup herem, but I am hard coding based on an AWS Cognito user
        const isAdmin = token.subject === '77a97e5b-b748-45e5-bb6f-658e85b2df91';
        if (isAdmin) {

            // For admin users we hard code this user id, assign a role of 'admin' and grant access to all regions
            // The CompanyService class will use these claims to return all transaction data
            return new SampleCustomClaims('20116', 'admin', ['Europe', 'USA', 'Asia']);

        } else {

            // For other users we hard code this user id, assign a role of 'user' and grant access to only one region
            // The CompanyService class will use these claims to return only transactions for the US region
            return new SampleCustomClaims('10345', 'user', ['USA']);
        }
    }

    /*
     * An override to load custom claims when they are read from the cache
     */
    public deserialize(data: any): CustomClaims {
        return SampleCustomClaims.importData(data);
    }
}
