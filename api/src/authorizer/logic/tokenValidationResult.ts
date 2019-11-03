import {ApiClaims} from '../../shared/entities/apiClaims';

/*
 * The result of trying to validate a token
 */
export interface TokenValidationResult {
    isValid: boolean;
    expiry: number | null;
    claims: ApiClaims | null;
}
