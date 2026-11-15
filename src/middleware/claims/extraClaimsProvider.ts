import {inject, injectable} from 'inversify';
import {JWTPayload} from 'jose';
import {UserRepository} from '../../logic/repositories/userRepository';
import {APIGatewayProxyExtendedEvent} from '../../utilities/apiGatewayExtendedProxyEvent';
import {ClaimsReader} from './claimsReader';
import {CustomClaimNames} from './customClaimNames';
import {ExtraClaims} from './extraClaims';

/*
 * Add extra claims that you cannot, or do not want to, manage in the authorization server
 */
@injectable()
export class ExtraClaimsProvider {

    private readonly userRepository: UserRepository;

    public constructor(@inject(UserRepository) userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    /*
     * Get additional claims from the API's own data
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async lookupExtraClaims(jwtClaims: JWTPayload, event: APIGatewayProxyExtendedEvent): Promise<any> {

        const managerId = ClaimsReader.getStringClaim(jwtClaims, CustomClaimNames.managerId);
        return this.userRepository.getUserInfoForManagerId(managerId);
    }

    /*
     * Get extra claims from the cache
     */
    public deserializeFromCache(json: string): any {
        return JSON.parse(json) as ExtraClaims;
    }
}
