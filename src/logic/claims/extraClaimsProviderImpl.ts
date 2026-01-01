import {JWTPayload} from 'jose';
import {ClaimsReader} from '../../plumbing/claims/claimsReader.js';
import {CustomClaimNames} from '../../plumbing/claims/customClaimNames.js';
import {ExtraClaims} from '../../plumbing/claims/extraClaims.js';
import {ExtraClaimsProvider} from '../../plumbing/claims/extraClaimsProvider.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {APPLICATIONTYPES} from '../dependencies/applicationTypes.js';
import {UserRepository} from '../repositories/userRepository.js';

/*
 * Add extra claims that you cannot, or do not want to, manage in the authorization server
 */
export class ExtraClaimsProviderImpl implements ExtraClaimsProvider {

    /*
     * Get additional claims from the API's own data
     */
    public async lookupExtraClaims(jwtClaims: JWTPayload, event: APIGatewayProxyExtendedEvent): Promise<any> {

        // Get an object to look up user information
        const userRepository = event.container.get<UserRepository>(APPLICATIONTYPES.UserRepository);

        // Look up values using the manager ID, a business user identity
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
