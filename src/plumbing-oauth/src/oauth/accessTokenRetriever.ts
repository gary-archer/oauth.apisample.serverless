import cookie from 'cookie';
import {decryptCookie} from 'cookie-encrypter';
import {inject, injectable} from 'inversify';
import {ErrorFactory} from '../../../plumbing-base';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {OAuthErrorUtils} from '../errors/oauthErrorUtils';

/*
 * The SPA sends secure cookies to the API gateway, whereas mobile and desktop clients send tokens
 */
@injectable()
export class AccessTokenRetriever {

    private readonly _configuration: OAuthConfiguration;

    public constructor(
        @inject(OAUTHTYPES.Configuration) configuration: OAuthConfiguration) {
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
        const accessToken = this._decryptCookie('access', accessCookie);

        // Make extra CSRF checks for data changing commands
        if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {

            if (!csrfCookie) {
                throw OAuthErrorUtils.fromAntiForgeryError();
            }

            const csrfToken = this._decryptCookie('csrf', csrfCookie);
            if (csrfHeader !== csrfToken) {
                throw OAuthErrorUtils.fromAntiForgeryError();
            }
        }

        // Return the access token to undergo JWT validation
        return accessToken;
    }

    /*
     * A helper method to decrypt a cookie and report errors clearly
     */
    private _decryptCookie(cookieName: string, encryptedData: string): string {

        try {

            // Try the AES256 decryption
            return decryptCookie(encryptedData, {key: this._configuration.cookieDecryptionKey});

        } catch (e) {

            // Get an error
            throw OAuthErrorUtils.fromCookieDecryptionError(cookieName, e);
        }
    }
}
