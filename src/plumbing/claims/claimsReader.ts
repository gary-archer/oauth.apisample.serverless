import {JWTPayload} from 'jose';
import {ErrorUtils} from '../errors/errorUtils.js';

/*
 * A utility to read claims defensively
 */
export class ClaimsReader {

    /*
     * Get a mandatory string claim from the claims payload
     */
    public static getStringClaim(data: JWTPayload, name: string): string {

        const value = data[name];
        if (!value) {
            throw ErrorUtils.fromMissingClaim(name);
        }

        return value as string;
    }
}
