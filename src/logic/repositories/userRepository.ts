import {injectable} from 'inversify';
import {SampleExtraClaims} from '../claims/sampleExtraClaims.js';

/*
 * A repository that returns hard coded data, whereas a real implementation would use a database lookup
 */
@injectable()
export class UserRepository {

    /*
     * Receive the subject claim from the AWS Cognito access token and look up all other claims
     */
    public getClaimsForSubject(subject: string): SampleExtraClaims {

        if (subject === 'd3d64319-1f84-42bb-92cb-5883793c50dc') {

            // These claims are used for the guestadmin@mycompany.com user account
            return new SampleExtraClaims('20116', 'admin', 'Global Manager', ['Europe', 'USA', 'Asia']);

        } else if (subject === '06e3c525-33d1-47ec-97be-03d8affc3726') {

            // These claims are used for the guestuser@mycompany.com user account
            return new SampleExtraClaims('10345', 'user', 'Regional Manager', ['USA']);

        } else {

            // Use empty claims for unrecognized users
            return new SampleExtraClaims('', '', '', []);
        }
    }
}
