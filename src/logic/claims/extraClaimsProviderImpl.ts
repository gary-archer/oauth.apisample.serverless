import {JWTPayload} from 'jose';
import {ClaimsReader} from '../../plumbing/claims/claimsReader.js';
import {ExtraClaimsProvider} from '../../plumbing/claims/extraClaimsProvider.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {SAMPLETYPES} from '../dependencies/sampleTypes.js';
import {UserRepository} from '../repositories/userRepository.js';
import {CustomClaimNames} from './customClaimNames.js';
import {ExtraClaims} from './extraClaims.js';

/*
 * Add extra claims that you cannot, or do not want to, manage in the authorization server
 */
export class ExtraClaimsProviderImpl implements ExtraClaimsProvider {

    /*
     * Get additional claims from the API's own data
     */
    public async lookupExtraClaims(jwtClaims: JWTPayload, event: APIGatewayProxyExtendedEvent): Promise<any> {

        // Get an object to look up user information
        const userRepository = event.container.get<UserRepository>(SAMPLETYPES.UserRepository);

        // The manager ID is a business user identity from which other claims can be looked up
        const managerId = ClaimsReader.getStringClaim(jwtClaims, CustomClaimNames.managerId);
        return userRepository.getUserInfoForManagerId(managerId);
    }

    /*
     * Get extra claims from the cache
     */
    public deserializeFromCache(json: string): any {
        return JSON.parse(json) as ExtraClaims;
    }
}
