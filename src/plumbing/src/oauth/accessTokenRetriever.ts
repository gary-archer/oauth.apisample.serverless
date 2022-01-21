import base64url from 'base64url';
import cookie from 'cookie';
import crypto from 'crypto';
import {inject, injectable} from 'inversify';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {ErrorFactory} from '../errors/errorFactory';
import {ErrorUtils} from '../errors/errorUtils';

/*
 * A class to deal with retrieving the access token, which is simple when it is sent directly
 * This class also deals with an SPA sending secure cookies, in which case we must decrypt and make some extra checks
 */
@injectable()
export class AccessTokenRetriever {

    private readonly _configuration: OAuthConfiguration;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration) {
        this._configuration = configuration;
    }

    /*
     * Try to read the token from either the authorization header or cookies
     */
    public getAccessToken(event: any): string {

        // Look for a token first, from native clients
        const accessToken = this._readAccessToken(event);
        if (accessToken) {
            return accessToken;
        }

        // Next look for secure cookie data from web clients
        const accessCookie = this._readCookie('at', event);
        const csrfCookie = this._readCookie('csrf', event);
        const csrfHeader = event.headers[`x-${this._configuration.cookiePrefix}-csrf`];
        if (accessCookie) {

            // Get the access token from the secure cookie
            return this._processCookiesToAccessToken(
                accessCookie,
                csrfCookie,
                csrfHeader,
                event.httpMethod.toLowerCase());
        }

        // Error if not found
        throw ErrorFactory.createClient401Error('No access token was found in an API request');
    }

    /*
     * Try to read the token from the authorization header
     */
    private _readAccessToken(event: any): string | null {

        if (event && event.headers) {

            const authorizationHeader = event.headers.authorization || event.headers.Authorization;
            if (authorizationHeader) {
                const parts = authorizationHeader.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') {
                    return parts[1];
                }
            }
        }

        return null;
    }

    /*
     * Try to read a field from the cookie header
     */
    private _readCookie(name: string, event: any): string | null {

        const cookieName = `${this._configuration.cookiePrefix}-${name}`;

        let result = null;
        const headers = this._getMultiValueHeader('cookie', event);
        headers.forEach((h) => {

            const data = cookie.parse(h);
            if (data[cookieName]) {
                result = data[cookieName];
            }
        });

        return result;
    }

    /*
     * Read a multi value header, which is how cookies are received
     */
    private _getMultiValueHeader(name: string, event: any): string[] {

        if (event.headers) {

            const found = Object.keys(event.multiValueHeaders).find((h) => h.toLowerCase() === name);
            if (found) {
                return event.multiValueHeaders[found];
            }
        }

        return [];
    }

    /*
     * If all conditions are satisfied then return the access token by decrypting the access cookie
     */
    private _processCookiesToAccessToken(
        accessCookie: string,
        csrfCookie: string | null,
        csrfHeader: string | null,
        method: string): string {

        // Get the token from the secure cookie
        const accessToken = this._decryptCookie('at', accessCookie);

        // Make extra CSRF checks for data changing commands
        if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {

            if (!csrfCookie) {
                throw ErrorUtils.fromAntiForgeryError();
            }

            const csrfToken = this._decryptCookie('csrf', csrfCookie);
            if (csrfHeader !== csrfToken) {
                throw ErrorUtils.fromAntiForgeryError();
            }
        }

        // Return the access token to undergo JWT validation
        return accessToken;
    }

    /*
     * A helper method to decrypt a cookie using AES256-GCM and report errors clearly
     */
    private _decryptCookie(cookieName: string, encryptedData: string): string {

        const VERSION_SIZE = 1;
        const GCM_IV_SIZE = 12;
        const GCM_TAG_SIZE = 16;
        const CURRENT_VERSION = 1;

        const allBytes = base64url.toBuffer(encryptedData);

        const minSize = VERSION_SIZE + GCM_IV_SIZE + 1 + GCM_TAG_SIZE;
        if (allBytes.length < minSize) {
            throw ErrorUtils.fromMalformedCookieError(cookieName, 'The received cookie has an invalid length');
        }

        const version = allBytes[0];
        if (version != CURRENT_VERSION) {
            throw ErrorUtils.fromMalformedCookieError(cookieName, 'The received cookie has an invalid format');
        }

        let offset = VERSION_SIZE;
        const ivBytes = allBytes.slice(offset, offset + GCM_IV_SIZE);

        offset += GCM_IV_SIZE;
        const ciphertextBytes = allBytes.slice(offset, allBytes.length - GCM_TAG_SIZE);

        offset = allBytes.length - GCM_TAG_SIZE;
        const tagBytes = allBytes.slice(offset, allBytes.length);

        try {

            const encKeyBytes = Buffer.from(this._configuration.cookieDecryptionKey, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-gcm', encKeyBytes, ivBytes);
            decipher.setAuthTag(tagBytes);

            const decryptedBytes = decipher.update(ciphertextBytes);
            const finalBytes = decipher.final();

            const plaintextBytes = Buffer.concat([decryptedBytes, finalBytes]);
            return plaintextBytes.toString();

        } catch (e: any) {
            throw ErrorUtils.fromCookieDecryptionError(cookieName, e);
        }
    }
}
