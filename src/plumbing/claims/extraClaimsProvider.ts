import {JWTPayload} from 'jose';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';

/*
 * Add extra claims that you cannot, or do not want to, manage in the authorization server
 */
export interface ExtraClaimsProvider {

    /*
     * Get extra claims from the API's own data
     */
    lookupExtraClaims(jwtClaims: JWTPayload, event: APIGatewayProxyExtendedEvent): Promise<any>;

    /*
     * Get extra claims from the cache
     */
    deserializeFromCache(json: string): any;
}
