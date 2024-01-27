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

        // The manager ID is a business user identity from which other claims can be looked up
        const managerId = ClaimsReader.getStringClaim(jwtClaims, 'manager_id');
        return userRepository.getClaimsForManagerId(managerId);
    }

    /*
     * Deserialize extra claims after they have been read from the cache
     */
    public deserializeFromCache(data: any): ExtraClaims {
        return SampleExtraClaims.importData(data);
    }
}
