/*
 * Cookie handling should ideally not be coded in the API, so is separated to its own folder
 */

import {APIGatewayProxyEvent} from 'aws-lambda';
import base64url from 'base64url';
import cookie from 'cookie';
import crypto from 'crypto';
import {inject, injectable} from 'inversify';
import {CookieConfiguration} from '../configuration/cookieConfiguration';
import {CookieErrorUtils} from '../cookies/cookieErrorUtils';
import {BASETYPES} from '../dependencies/baseTypes';

/*
 * A class to deal with retrieving the access toke from a secure cookie and making CSRF related checks
 */
@injectable()
export class CookieProcessor {

    private readonly _configuration: CookieConfiguration;

    public constructor(
        @inject(BASETYPES.CookieConfiguration) configuration: CookieConfiguration) {
        this._configuration = configuration;
    }

    /*
     * Try to read the token from either the authorization header or cookies
     */
    public getAccessToken(event: APIGatewayProxyEvent): string | null {

        // First see if we have a request with secure cookies
        const name = 'at';
        const accessCookie = this._readCookie(name, event);
        if (!accessCookie) {
            return null;
        }

        // First check the web origin
        this._validateOrigin(event);

        // For data changing commands, enforce CSRF checks
        const method = event.httpMethod.toLowerCase();
        if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
            this._enforceCsrfChecks(event);
        }

        // Finally decrypt the cookie to get the token
        return this._decryptCookie(name, accessCookie);
    }

    /*
     * Reject any calls whose origin header (sent by all modern browsers) is not trusted
     */
    private _validateOrigin(event: APIGatewayProxyEvent): void {

        const origin = this._readHeader('origin', event);
        if (!origin) {
            throw CookieErrorUtils.fromMissingOriginError();
        }

        const trusted = this._configuration.trustedWebOrigins.find(o => o === origin);
        if (!trusted) {
            throw CookieErrorUtils.fromUntrustedOriginError();
        }
    }

    /*
     * Enforce OWASP best practice checks for data changing commands
     */
    private _enforceCsrfChecks(event: APIGatewayProxyEvent): void {

        const name = 'csrf';
        const csrfCookie = this._readCookie(name, event);
        if (!csrfCookie) {
            throw CookieErrorUtils.fromMissingCookieError(name);
        }

        const csrfHeader = this._readHeader(`x-${this._configuration.cookiePrefix}-${name}`, event);
        if (!csrfHeader) {
            throw CookieErrorUtils.fromMissingAntiForgeryTokenError();
        }

        const csrfToken = this._decryptCookie(name, csrfCookie);
        if (csrfHeader !== csrfToken) {
            throw CookieErrorUtils.fromMismatchedAntiForgeryTokenError();
        }
    }

    /*
     * Read a single value header value
     */
    private _readHeader(name: string, event: APIGatewayProxyEvent): string | null {

        if (event.headers) {

            const found = Object.keys(event.headers).find((h) => h.toLowerCase() === name);
            if (found) {
                return event.headers[found] as string;
            }
        }

        return null;
    }

    /*
     * Try to read a field from the cookie header
     */
    private _readCookie(name: string, event: APIGatewayProxyEvent): string | null {

        const cookieName = `${this._configuration.cookiePrefix}-${name}`;

        let result = null;
        const headers = this._readMultiValueHeader('cookie', event);
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
    private _readMultiValueHeader(name: string, event: APIGatewayProxyEvent): string[] {

        if (event.headers) {

            const found = Object.keys(event.multiValueHeaders).find((h) => h.toLowerCase() === name);
            if (found) {
                return event.multiValueHeaders[found] as string[];
            }
        }

        return [];
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
            throw CookieErrorUtils.fromMalformedCookieError(cookieName, 'The received cookie has an invalid length');
        }

        const version = allBytes[0];
        if (version != CURRENT_VERSION) {
            throw CookieErrorUtils.fromMalformedCookieError(cookieName, 'The received cookie has an invalid format');
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
            throw CookieErrorUtils.fromCookieDecryptionError(cookieName, e);
        }
    }
}
