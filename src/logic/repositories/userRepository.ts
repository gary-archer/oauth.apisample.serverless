import {injectable} from 'inversify';
import {SampleExtraClaims} from '../claims/sampleExtraClaims.js';

/*
 * A repository that returns hard coded data, whereas a real implementation would use a database lookup
 */
@injectable()
export class UserRepository {

    /*
     * Receive the manager ID in the access token, as a useful identity to the API, then look up extra claims
     */
    public getClaimsForManagerId(managerId: string): SampleExtraClaims {

        if (managerId === '20116') {

            // These claims are used for the guestadmin@mycompany.com user account
            return new SampleExtraClaims('Global Manager', ['Europe', 'USA', 'Asia']);

        } else if (managerId == '10345') {

            // These claims are used for the guestuser@mycompany.com user account
            return new SampleExtraClaims('Regional Manager', ['USA']);

        } else {

            // Use empty claims for unrecognized users
            return new SampleExtraClaims('', []);
        }
    }
}
