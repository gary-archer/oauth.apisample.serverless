import {JWTPayload} from 'jose';
import {ClaimsReader} from '../../plumbing/claims/claimsReader';
import {CustomClaimNames} from '../../plumbing/claims/customClaimNames';
import {ExtraClaims} from '../../plumbing/claims/extraClaims';
import {ExtraClaimsProvider} from '../../plumbing/claims/extraClaimsProvider';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent';
import {APPLICATIONTYPES} from '../dependencies/applicationTypes';
import {UserRepository} from '../repositories/userRepository';

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
