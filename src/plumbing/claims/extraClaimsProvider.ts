import {JWTPayload} from 'jose';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {ExtraClaims} from './extraClaims.js';

/*
 * An interface through which OAuth plumbing code calls a repository in the API logic
 */
export interface ExtraClaimsProvider {
    lookupExtraClaims(jwtClaims: JWTPayload, event: APIGatewayProxyExtendedEvent): Promise<ExtraClaims>;
}
