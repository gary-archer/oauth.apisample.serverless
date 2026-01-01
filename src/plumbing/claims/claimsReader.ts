import {JWTPayload} from 'jose';
import {ErrorUtils} from '../errors/errorUtils.js';

/*
 * A utility to read claims defensively
 */
export class ClaimsReader {

    /*
     * Get a mandatory string claim from the claims payload
     */
    public static getStringClaim(data: JWTPayload, name: string, required = true): string {

        const value = data[name];
        if (!value) {
            if (required) {
                throw ErrorUtils.fromMissingClaim(name);
            } else {
                return '';
            }
        }

        return value as string;
    }
}
