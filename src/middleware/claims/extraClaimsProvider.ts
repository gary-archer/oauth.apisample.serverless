import {JWTPayload} from 'jose';
import {UserRepository} from '../../logic/repositories/userRepository';
import {APIGatewayProxyExtendedEvent} from '../../utilities/apiGatewayExtendedProxyEvent';
import {ClaimsReader} from './claimsReader';
import {CustomClaimNames} from './customClaimNames';
import {ExtraClaims} from './extraClaims';

/*
 * Add extra claims that you cannot, or do not want to, manage in the authorization server
 */
export class ExtraClaimsProvider {

    /*
     * Get additional claims from the API's own data
     */
    public async lookupExtraClaims(jwtClaims: JWTPayload, event: APIGatewayProxyExtendedEvent): Promise<any> {

        // Get an object to look up user information
        const userRepository = event.container.get(UserRepository);

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
