import {SampleCustomClaims} from '../../logic/entities/sampleCustomClaims';
import {BaseClaims, CustomClaims, CustomClaimsProvider, UserInfoClaims} from '../../plumbing';

/*
 * This class provides any API specific custom claims
 */
export class SampleCustomClaimsProvider extends CustomClaimsProvider {

    /*
     * A hard coded override to set some domain specific claims
     */
    public async get(accessToken: string, token: BaseClaims, userInfo: UserInfoClaims): Promise<CustomClaims> {

        const isAdmin = userInfo.email.toLowerCase().indexOf('admin') !== -1;
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

    /*
     * An override to load custom claims when they are read from the cache
     */
    public deserialize(data: any): CustomClaims {
        return SampleCustomClaims.importData(data);
    }
}
