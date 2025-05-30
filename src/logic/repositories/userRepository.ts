import {ExtraClaims} from '../claims/extraClaims.js';

/*
 * A repository that returns extra authorization values from the API's own data
 */
export class UserRepository {

    /*
     * Given a manager ID look up extra values from the API's own data
     */
    public async getUserInfoForManagerId(managerId: string): Promise<any> {

        if (managerId === '20116') {

            // These claims are used for the guestadmin@example.com user account
            return ExtraClaims.create('Global Manager', ['Europe', 'USA', 'Asia']);

        } else if (managerId == '10345') {

            // These claims are used for the guestuser@example.com user account
            return ExtraClaims.create('Regional Manager', ['USA']);

        } else {

            // Use empty claims for unrecognized users
            return new ExtraClaims();
        }
    }
}
