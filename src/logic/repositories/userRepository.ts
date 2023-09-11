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

        if (subject === '77a97e5b-b748-45e5-bb6f-658e85b2df91') {

            // These claims are used for the guestadmin@mycompany.com user account
            return new SampleExtraClaims('20116', 'admin', 'Global Manager', ['Europe', 'USA', 'Asia']);

        } else if (subject === 'a6b404b1-98af-41a2-8e7f-e4061dc0bf86') {

            // These claims are used for the guestuser@mycompany.com user account
            return new SampleExtraClaims('10345', 'user', 'Regional Manager', ['USA']);

        } else {

            // Use empty claims for unrecognized users
            return new SampleExtraClaims('', '', '', []);
        }
    }
}
