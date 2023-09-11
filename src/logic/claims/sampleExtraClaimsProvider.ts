import {JWTPayload} from 'jose';
import {Container} from 'inversify';
import {ClaimsReader} from '../../plumbing/claims/claimsReader.js';
import {ExtraClaims} from '../../plumbing/claims/extraClaims.js';
import {ExtraClaimsProvider} from '../../plumbing/claims/extraClaimsProvider.js';
import {SAMPLETYPES} from '../dependencies/sampleTypes.js';
import {UserRepository} from '../repositories/userRepository.js';
import {SampleExtraClaims} from './sampleExtraClaims.js';

/*
 * Add extra claims that you cannot, or do not want to, manage in the authorization server
 */
export class SampleExtraClaimsProvider extends ExtraClaimsProvider {

    private readonly _container: Container;

    public constructor(container: Container) {
        super();
        this._container = container;
    }

    /*
     * Get additional claims from the API's own database
     */
    public async lookupExtraClaims(jwtClaims: JWTPayload): Promise<ExtraClaims> {

        // Get an object to look up user information
        const userRepository = this._container.get<UserRepository>(SAMPLETYPES.UserRepository);

        // With AWS Cognito, there is a lack of support for custom claims in access tokens at the time of writing
        // So the API has to map the subject to its own user identity and look up all custom claims
        const subject = ClaimsReader.getStringClaim(jwtClaims, 'sub');
        return userRepository.getClaimsForSubject(subject);
    }

    /*
     * Deserialize extra claims after they have been read from the cache
     */
    public deserializeFromCache(data: any): ExtraClaims {
        return SampleExtraClaims.importData(data);
    }
}
