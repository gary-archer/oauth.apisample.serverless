import {CoreApiClaims} from '../../../framework-api-base';

/*
 * The result of trying to validate a token
 */
export interface TokenValidationResult {
    isValid: boolean;
    claims: CoreApiClaims | null;
}
