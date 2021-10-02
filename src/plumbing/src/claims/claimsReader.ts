import {JWTPayload} from 'jose/types';
import {ErrorUtils} from '../errors/errorUtils';
import {BaseClaims} from './baseClaims';
import {UserInfoClaims} from './userInfoClaims';

/*
 * A utility for gathering claims
 */
export class ClaimsReader {

    /*
     * Return the base claims in a JWT that the API is interested in
     */
    public static baseClaims(payload: JWTPayload): BaseClaims {

        const subject = ClaimsReader._readClaim(payload, 'sub');
        const scopes = ClaimsReader._readClaim(payload, 'scope').split(' ');
        const expiry = parseInt(ClaimsReader._readClaim(payload, 'exp'), 10);
        return new BaseClaims(subject, scopes, expiry);
    }

    /*
     * Return the base claims in a JWT that the API is interested in
     */
    public static userInfoClaims(payload: any): UserInfoClaims {

        const givenName =  ClaimsReader._readClaim(payload, 'given_name');
        const familyName =  ClaimsReader._readClaim(payload, 'family_name');
        const email =  ClaimsReader._readClaim(payload, 'email');
        return new UserInfoClaims(givenName, familyName, email);
    }

    /*
     * Sanity checks when receiving claims to avoid failing later with a cryptic error
     */
    private static _readClaim(payload: JWTPayload, name: string): string {

        const value = payload[name];
        if (!value) {
            throw ErrorUtils.fromMissingClaim(name);
        }

        return value as string;
    }
}
